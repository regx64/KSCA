import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Board posts are markdown (README §4). react-markdown never renders raw
// HTML by default, so user content can't inject markup or scripts; links
// open safely in a new tab.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
