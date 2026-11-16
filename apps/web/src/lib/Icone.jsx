import { icons } from 'lucide-react';
import { paraCamel } from './util.js';

/* Marcas que o Lucide não tem — desenhos próprios (fill, sem stroke).
   'x' continua sendo o X de fechar; o logotipo do X é 'x-logo'. */
const MARCAS = {
  'discord': (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8387-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  ),
  'x-logo': (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  tiktok: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.53 1.5h3.298a6.35 6.35 0 0 0 3.932 5.772v3.284a9.62 9.62 0 0 1-5.614-1.796v7.996a6.504 6.504 0 1 1-6.503-6.504c.178 0 .354.007.528.021v3.31a3.213 3.213 0 1 0 3.213 3.213V1.5Z" />
    </svg>
  ),
  whatsapp: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.39 15.24L2.5 21.5l4.38-1.12A9.9 9.9 0 1 0 12.04 2Zm5.8 14.03c-.25.7-1.45 1.34-2.02 1.38-.57.05-1.1.24-3.7-1.02s-4.12-4.2-4.25-4.4c-.13-.2-.83-1.16-.8-2.2.02-1.04.56-1.53.76-1.75.2-.22.44-.27.6-.27h.43c.14 0 .33-.05.5.39.18.44.6 1.54.66 1.65.05.11.09.24.01.39-.08.15-.15.24-.3.39l-.44.51c-.14.14-.3.3-.14.59.16.28.73 1.26 1.57 2.04 1.08 1 1.98 1.32 2.26 1.47.28.15.45.13.62-.07.16-.2.7-.81.9-1.09.19-.28.39-.23.65-.13.26.09 1.65.83 1.94.98.28.15.47.22.54.34.07.12.07.7-.18 1.4Z" />
    </svg>
  )
};

/* Ícone pelo nome em kebab-case vindo da config (ex.: 'gamepad-2').
   Nome desconhecido cai num ícone de alerta, nunca quebra a página. */
export default function Icone({ nome, ...props }) {
  const Componente = MARCAS[nome] || icons[paraCamel(nome)] || icons.Ban;
  return <Componente {...props} />;
}

/* Coroa usada no pódio e no mini-ranking (desenho igual ao original) */
export function Coroa(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}

/* Figurinha de "campeão" ao lado do nome no pódio */
export function FiguraPodio(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 12, height: 12 }} {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 9" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 9" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

/* Galho de louro — acompanha o número no degrau do pódio */
export function Louro(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M17.5 21.5C11.5 20.2 8.2 15.4 8.2 9.2c0-1.9.35-3.6 1-5.2" />
      <path d="M11.6 20.4C9.9 17.8 6.2 17.4 3.9 19 5.5 21.6 9.3 22 11.6 20.4Z" />
      <path d="M8.6 13.8C8.4 10.8 5.6 8.7 2.8 9.3 3 12.3 5.8 14.4 8.6 13.8Z" />
      <path d="M9.4 8C11.5 6 11.7 3 10 1.2 7.9 3.2 7.7 6.1 9.4 8Z" />
      <path d="M12.9 16.9C13.6 14.3 12.6 11.7 10.4 10.3 9.7 12.9 10.7 15.5 12.9 16.9Z" />
    </svg>
  );
}

/* As 5 estrelas dos depoimentos (classe 'vazia' apaga a que falta) */
export function Estrelas({ nota }) {
  return Array.from({ length: 5 }, (_, i) => (
    <svg key={i} viewBox="0 0 24 24" className={i < nota ? '' : 'vazia'}>
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  ));
}

/* Visto verde (toast, copiar cupom, pedido confirmado) */
export function CheckSvg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
