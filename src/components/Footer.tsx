import { Bot, Mail, Megaphone, Phone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const contatcLinks = [
    {
      icon: <Mail className="size-4 text-primary" />,
      label: "Email",
      href: "mailto:akmalkarimboyev529@gmail",
      title: "Akmal Karimboyev's Email",
    },
    {
      icon: <Phone className="size-4 text-primary" />,
      label: "Phone",
      href: "tel:+998921981401",
      title: "Akmal Karimboyev's Phone",
    },
    {
      icon: <Megaphone className="size-4 text-primary" />,
      label: "Telegram kanal",
      href: "https://t.me/vokabi",
      title: "Telegram kanal",
    },
    {
      icon: <Bot className="size-4 text-primary" />,
      label: "Telegram bot — Pro olish",
      href: "https://t.me/vokabi_bot",
      title: "Telegram bot",
    },
  ];

  return (
    <footer style={{ backgroundColor: 'hsl(var(--footer-bg))', color: 'hsl(var(--footer-fg))' }}>
      <div className="container mx-auto px-4 py-14 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold tracking-tight">
                Vokabi
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              {t("footer.description")}
            </p>
            <div className="flex gap-3">
              <Link
                to="https://t.me/vokabi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-xs font-bold text-white"
                title="Telegram kanal"
              >
                <Megaphone className="size-4" />
              </Link>
              <Link
                to="https://t.me/vokabi_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-xs font-bold text-white"
                title="Telegram bot"
              >
                <Bot className="size-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-white/80">
              {t("footer.product")}
            </h4>
            <ul className="space-y-3">
              {[
                t("footer.practiceTests"),
                t("footer.mockExams"),
                t("footer.studyMaterials"),
                t("footer.progressTracking"),
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/60 hover:text-primary transition-colors text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-white/80">
              {t("footer.company")}
            </h4>
            <ul className="space-y-3">
              {[t("footer.aboutUs"), t("footer.blog"), t("footer.careers"), t("footer.contactUs")].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-white/60 hover:text-primary transition-colors text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-white/80">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-4">
              {contatcLinks.map(({ icon, label, href, title }) => (
                <li key={label} className="flex items-center gap-3">
                  {icon}
                  <Link
                    to={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-primary transition-colors text-sm"
                    title={title}
                  >
                    {label === "Email"
                      ? "akmalkarimboyev529@gmail"
                      : label === "Phone"
                        ? "+998 92 198 14 01"
                        : label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-xs">
            © {currentYear} Vokabi. {t("footer.rights")} {t("footer.createdBy")}{" "}
            <Link
              to="https://t.me/a_karimboyev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline transition-colors font-semibold"
              title="Akmal Karimboyev's Telegram"
            >
              Akmal Karimboyev
            </Link>
          </p>
          <div className="flex gap-6 text-xs">
            {[t("footer.privacyPolicy"), t("footer.termsOfService")].map((item) => (
              <a
                key={item}
                href="#"
                className="text-white/50 hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
