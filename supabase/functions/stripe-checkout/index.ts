import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_IDS: Record<string, string> = {
  "1_month":  "price_1Tcdj92evB4AJu4FeZOce8zH",
  "6_months": "price_1TcdjT2evB4AJu4FsXOjte58",
  "1_year":   "price_1Tcdjs2evB4AJu4FQU8ZcYTm",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planKey, userId, userEmail, successUrl, cancelUrl } = await req.json();

    const priceId = PRICE_IDS[planKey];
    if (!priceId) {
      return new Response(JSON.stringify({ error: "Noto'g'ri plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.get("origin")}/pricing?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing?canceled=true`,
      customer_email: userEmail,
      metadata: { userId, planKey },
      subscription_data: {
        metadata: { userId, planKey },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
