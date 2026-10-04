import katex from 'katex';
import 'katex/dist/katex.min.css';

const cache = new Map<string, string>();

/** Transforme un texte contenant des formules `$...$` en HTML (KaTeX).
 *  Le texte hors formules est gardé tel quel (il peut contenir du HTML de confiance, ex. <br>, <b>). */
export function renderMath(src: string): string {
  const hit = cache.get(src);
  if (hit !== undefined) return hit;
  const html = src
    .split(/(\$[^$]+\$)/g)
    .map(part => {
      if (part.length > 2 && part.startsWith('$') && part.endsWith('$')) {
        return katex.renderToString(part.slice(1, -1), { throwOnError: false, output: 'html' });
      }
      return part;
    })
    .join('');
  cache.set(src, html);
  return html;
}

type Props = { children: string; as?: 'span' | 'p' | 'div'; className?: string };

export function Tex({ children, as: Tag = 'span', className }: Props) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: renderMath(children) }} />;
}
