import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") as string,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Plan muddatini hisoblash
function getExpiresAt(planKey: string): string {
  const now = new Date();
  if (planKey === "1_month")  now.setMonth(now.getMonth() + 1);
  if (planKey === "6_months") now.setMonth(now.getMonth() + 6);
  if (planKey === "1_year")   now.setFullYear(now.getFullYear() + 1);
  return now.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }

  console.log("Stripe event:", event.type);

  try {
    // To'lov muvaffaqiyatli bo'lganda
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, planKey } = session.metadata || {};

      if (!userId || !planKey) {
        console.error("metadata yo'q:", session.metadata);
        return new Response("metadata yo'q", { status: 400 });
      }

      const expiresAt = getExpiresAt(planKey);
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      // Subscriptions jadvalini yangilash yoki yaratish
      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          plan: "pro",
          expires_at: expiresAt,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          plan_key: planKey,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) {
        console.error("Supabase upsert error:", error);
        throw error;
      }

      console.log(`✅ Pro yoqildi: userId=${userId}, plan=${planKey}, expires=${expiresAt}`);
    }

    // Obuna bekor qilinganda
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const { userId } = subscription.metadata || {};

      if (userId) {
        await supabase
          .from("subscriptions")
          .update({ plan: "free", expires_at: null, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        console.log(`❌ Pro o'chirildi: userId=${userId}`);
      }
    }

    // Obuna yangilanganda (keyingi oy to'lovi)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { userId, planKey } = subscription.metadata || {};

        if (userId && planKey) {
          const expiresAt = getExpiresAt(planKey);
          await supabase
            .from("subscriptions")
            .update({ plan: "pro", expires_at: expiresAt, updated_at: new Date().toISOString() })
            .eq("user_id", userId);

          console.log(`🔄 Pro yangilandi: userId=${userId}`);
        }
      }
    }

  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
