/* =========================================================
   Efeitos de animação da loja (portados do scripts.js)
   ========================================================= */
import { useEffect, useRef, useState } from 'react';
import { animsDesligadas } from '../lib/util.js';

/* Envoltório que revela o elemento suavemente quando entra na tela */
export function Reveal({ tag: Tag = 'div', className = '', delay, children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (animsDesligadas()) { el.classList.add('visivel'); return undefined; }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { el.classList.add('visivel'); obs.unobserve(el); }
      });
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={delay !== undefined ? { '--delay': `${delay}s` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* Número que sobe até o valor final quando o card entra na tela */
export function Contador({ valor, decimais = 0 }) {
  const ref = useRef(null);
  const [texto, setTexto] = useState('0');

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fmt = (v) => (decimais
      ? v.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais })
      : Math.floor(v).toLocaleString('pt-BR'));

    if (animsDesligadas()) { setTexto(fmt(valor)); return undefined; }

    const obs = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      const dur = 1300;
      const t0 = performance.now();
      const passo = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        setTexto(fmt(valor * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [valor, decimais]);

  return <span ref={ref}>{texto}</span>;
}

function telaInicial(frases) {
  const primeira = (frases && frases[0]) || { inicio: 'Viva', destaque: 'histórias épicas na cidade' };
  return { inicio: primeira.inicio, destaque: primeira.destaque, mostrar1: true, mostrar2: false };
}

/* Título digitado — frases: [{inicio, destaque}]. ligado=false deixa
   a primeira frase estática (igual ao comportamento original). */
export function useDatilo(frases, ligado) {
  const [tela, setTela] = useState(() => telaInicial(frases));
  const controle = useRef({ ativo: false, timer: null });

  useEffect(() => {
    const s = controle.current;
    s.ativo = false;
    if (s.timer) clearTimeout(s.timer);

    if (!ligado || !frases || !frases.length) {
      setTela(telaInicial(frases));
      return undefined;
    }

    s.ativo = true;
    const espera = (ms) => new Promise((r) => { s.timer = setTimeout(r, ms); });

    (async () => {
      while (s.ativo) {
        for (const item of frases) {
          if (!s.ativo) return;
          setTela({ inicio: '', destaque: '', mostrar1: true, mostrar2: false });

          for (const ch of item.inicio) {
            if (!s.ativo) return;
            setTela((t) => ({ ...t, inicio: t.inicio + ch }));
            await espera(55);
          }
          setTela((t) => ({ ...t, mostrar1: false, mostrar2: true }));

          for (const ch of item.destaque) {
            if (!s.ativo) return;
            setTela((t) => ({ ...t, destaque: t.destaque + ch }));
            await espera(55);
          }
          await espera(2200);

          for (let i = item.destaque.length; i > 0 && s.ativo; i--) {
            setTela((t) => ({ ...t, destaque: item.destaque.slice(0, i - 1) }));
            await espera(22);
          }
          setTela((t) => ({ ...t, mostrar2: false, mostrar1: true }));

          for (let i = item.inicio.length; i > 0 && s.ativo; i--) {
            setTela((t) => ({ ...t, inicio: item.inicio.slice(0, i - 1) }));
            await espera(22);
          }
          await espera(350);
        }
      }
    })();

    return () => { s.ativo = false; if (s.timer) clearTimeout(s.timer); };
  }, [ligado, frases]);

  return tela;
}

/* Fundo do hero: vários "GH" da marca subindo devagar, cada um com tamanho,
   velocidade e rotação próprios. Camada decorativa — some com "Reduzir
   animações" (data-anim off) e com prefers-reduced-motion (via CSS). */
const GHS_FUNDOS = [
  { x: 3,  tam: 120, dur: 26, atraso: -2,   op: .06, dx: '-8vw',  rot: '7deg' },
  { x: 12, tam: 84,  dur: 33, atraso: -14,  op: .05, dx: '6vw',   rot: '-6deg' },
  { x: 23, tam: 210, dur: 40, atraso: -9,   op: .05, dx: '-10vw', rot: '5deg' },
  { x: 34, tam: 64,  dur: 22, atraso: -5,   op: .09, dx: '7vw',   rot: '9deg' },
  { x: 44, tam: 96,  dur: 29, atraso: -19,  op: .06, dx: '-6vw',  rot: '-7deg' },
  { x: 55, tam: 150, dur: 36, atraso: -11,  op: .05, dx: '9vw',   rot: '6deg' },
  { x: 66, tam: 72,  dur: 24, atraso: -3,   op: .08, dx: '-7vw',  rot: '-9deg' },
  { x: 76, tam: 110, dur: 31, atraso: -16,  op: .06, dx: '6vw',   rot: '5deg' },
  { x: 87, tam: 180, dur: 42, atraso: -25,  op: .05, dx: '-9vw',  rot: '-5deg' },
  { x: 94, tam: 60,  dur: 20, atraso: -8,   op: .1,  dx: '5vw',   rot: '10deg' },
  { x: 18, tam: 52,  dur: 18, atraso: -1,   op: .1,  dx: '-5vw',  rot: '12deg' },
  { x: 40, tam: 44,  dur: 17, atraso: -13,  op: .12, dx: '6vw',   rot: '-12deg' },
  { x: 61, tam: 56,  dur: 19, atraso: -7,   op: .1,  dx: '-6vw',  rot: '11deg' },
  { x: 82, tam: 48,  dur: 21, atraso: -17,  op: .11, dx: '5vw',   rot: '-10deg' }
];

export function FundoGH() {
  return (
    <div className="hero-gh" aria-hidden="true">
      {GHS_FUNDOS.map((g, i) => (
        <i
          key={i}
          style={{
            left: g.x + '%',
            fontSize: g.tam,
            opacity: g.op,
            animationDuration: g.dur + 's',
            animationDelay: g.atraso + 's',
            '--dx': g.dx,
            '--rot': g.rot
          }}
        >
          GH
        </i>
      ))}
    </div>
  );
}
