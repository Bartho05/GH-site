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
  const primeira = (frases && frases[0]) || { inicio: 'Domine', destaque: 'o PvP da cidade' };
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
