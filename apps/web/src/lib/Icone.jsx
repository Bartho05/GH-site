import { icons } from 'lucide-react';
import { paraCamel } from './util.js';

/* Ícone pelo nome em kebab-case vindo da config (ex.: 'gamepad-2').
   Nome desconhecido cai num ícone de alerta, nunca quebra a página. */
export default function Icone({ nome, ...props }) {
  const Componente = icons[paraCamel(nome)] || icons.Ban;
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
