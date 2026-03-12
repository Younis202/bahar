import { FileText } from 'lucide-react';

interface Props {
  content: string | null;
  title: string;
}

export default function TextLessonContent({ content, title }: Props) {
  if (!content) {
    return (
      <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-2 opacity-30" />
          <p>No content available for this lesson yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-card border border-border p-8 md:p-12">
      <article className="prose prose-invert max-w-none">
        <div 
          className="text-foreground leading-relaxed space-y-4 text-base"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {content.split('\n\n').map((paragraph, i) => {
            // Detect headings (lines starting with # or ##)
            if (paragraph.startsWith('## ')) {
              return <h3 key={i} className="font-display text-xl font-bold text-foreground mt-8 mb-4">{paragraph.slice(3)}</h3>;
            }
            if (paragraph.startsWith('# ')) {
              return <h2 key={i} className="font-display text-2xl font-bold text-foreground mt-8 mb-4">{paragraph.slice(2)}</h2>;
            }
            // Detect bullet lists
            if (paragraph.split('\n').every(line => line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim() === '')) {
              return (
                <ul key={i} className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {paragraph.split('\n').filter(l => l.trim()).map((item, j) => (
                    <li key={j}>{item.replace(/^[-•]\s*/, '')}</li>
                  ))}
                </ul>
              );
            }
            // Detect numbered lists
            if (paragraph.split('\n').every(line => /^\d+[\.\)]\s/.test(line.trim()) || line.trim() === '')) {
              return (
                <ol key={i} className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  {paragraph.split('\n').filter(l => l.trim()).map((item, j) => (
                    <li key={j}>{item.replace(/^\d+[\.\)]\s*/, '')}</li>
                  ))}
                </ol>
              );
            }
            // Detect blockquotes
            if (paragraph.startsWith('> ')) {
              return (
                <blockquote key={i} className="border-l-4 border-primary/40 pl-4 py-2 italic text-muted-foreground bg-primary/5 rounded-r-lg">
                  {paragraph.slice(2)}
                </blockquote>
              );
            }
            // Regular paragraph
            return <p key={i} className="text-muted-foreground leading-relaxed">{paragraph}</p>;
          })}
        </div>
      </article>
    </div>
  );
}
