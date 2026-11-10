import React from "react";
import { SocialNetworks } from "./footer.types";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { LayoutSpacing } from "./LayoutSpacing";
import InputGroup from "@/components/ui/input-group";

const socialsData: SocialNetworks[] = [
  {
    id: 1,
    icon: <FaInstagram />,
    url: "https://www.instagram.com/nativa.revestimientos/?hl=es",
  },
  {
    id: 2,
    icon: <FaFacebookF />,
    url: "https://www.facebook.com/61556626936642/mentions/",
  },
];

const Footer = () => {
  return (
    <footer className="mt-10 footer">
      <div className="pt-8 md:pt-[50px] px-4 pb-6">
        <div className="max-w-frame mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <Link href="/" className="mb-4">
                <Image src="/images/nativa_logo.png" alt="Nativa Revestimientos" width={180} height={48} priority className="brightness-0 invert" />
              </Link>
              <p className="text-white text-sm mb-4 max-w-[320px]">
                Nativa Revestimientos — soluciones en revestimientos y maderas nativas. Asesoramiento, suministro y proyectos a medida.
              </p>
              <div className="flex items-center space-x-3">
                {socialsData.map((social) => (
                  <Link
                    href={social.url}
                    key={social.id}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex justify-center sm:justify-start">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-semibold mb-3 text-white">Productos</h4>
                <ul className="space-y-2 text-sm text-white">
                  <li><Link href="/shop" className="hover:text-white/80 transition">Todos</Link></li>
                  <li><Link href="/shop?filter=specialOffer" className="hover:text-white/80 transition">Ofertas especiales</Link></li>
                  <li><Link href="/shop?filter=newArrival" className="hover:text-white/80 transition">Nuevos productos</Link></li>
                </ul>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-sm font-semibold mb-3 text-white">Newsletter</h4>
              <p className="text-sm text-white/90 mb-3">
                Recibí promos y novedades antes que nadie.
              </p>
              <div className="flex flex-col gap-3">
                <InputGroup className="bg-white rounded-xl">
                  <InputGroup.Text className="mr-2">
                    <Image
                      priority
                      src="/icons/envelope.svg"
                      height={18}
                      width={18}
                      alt="email"
                      className="min-w-4 min-h-4"
                    />
                  </InputGroup.Text>
                  <InputGroup.Input
                    type="email"
                    name="email"
                    placeholder="Ingresá tu e-mail"
                    className="bg-transparent placeholder:text-gray-400 text-sm py-3"
                  />
                </InputGroup>
                <button
                  aria-label="Suscribirse al newsletter"
                  type="button"
                  className="h-[46px] px-6 rounded-xl bg-[rgb(var(--brand-600))] text-white font-semibold text-sm hover:bg-[rgb(var(--brand-700))] transition"
                >
                  ENVIAR
                </button>
              </div>
              <p className="text-[11px] text-white/80 mt-2.5">
                No compartimos tu información.
              </p>
            </div>
          </div>
          <hr className="h-[1px] border-t-white/20 my-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-white">
            <p className="mb-2 sm:mb-0">© {new Date().getFullYear()} Nativa Revestimientos. Todos los derechos reservados.</p>
            <p>Desarrollado por <Link href="https://tucsdigital.com/" className="text-white font-medium">TUCS DIGITAL</Link></p>
          </div>
        </div>
        <LayoutSpacing />
      </div>
    </footer>
  );
};

export default Footer;
