import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const SAMPLE = `function sum(nums) {
  let total = 0;
  for (let i = 0; i <= nums.length; i++) {
    total += nums[i];
  }
  return total;
}

console.log(sum([1, 2, 3]));`;

export default function App() {
  const [code, setCode] = useState(SAMPLE);
  const [filename, setFilename] = useState("utils.js");
  const [language, setLanguage] = useState("JavaScript");
  const [customLanguage, setCustomLanguage] = useState("");
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);
  const [prismReady, setPrismReady] = useState(false);
  const [history, setHistory] = useState([]);

  const canSubmit = useMemo(() => code.trim().length > 0 && !loading, [code, loading]);

  useEffect(() => {
    const stored = window.localStorage.getItem("crs-theme");
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("crs-history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("crs-theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    async function loadPrism() {
      try {
        globalThis.Prism = Prism;
        await import("prismjs/components/prism-clike");
        await import("prismjs/components/prism-c");
        await import("prismjs/components/prism-javascript");
        await import("prismjs/components/prism-typescript");
        await import("prismjs/components/prism-python");
        await import("prismjs/components/prism-java");
        await import("prismjs/components/prism-csharp");
        await import("prismjs/components/prism-cpp");
        await import("prismjs/components/prism-go");
        await import("prismjs/components/prism-rust");
        await import("prismjs/components/prism-php");
        await import("prismjs/components/prism-ruby");
        if (active) setPrismReady(true);
      } catch {
        if (active) setPrismReady(false);
      }
    }
    loadPrism();
    return () => {
      active = false;
    };
  }, []);

  const highlightCode = (input) => {
    if (!prismReady || !Prism?.languages) return input;
    const lang = normalizeLanguage(language, customLanguage);
    const prismLang = toPrismLanguage(lang);
    const grammar = Prism.languages[prismLang] || Prism.languages.javascript;
    if (!grammar || typeof Prism.highlight !== "function") return input;
    try {
      return Prism.highlight(input, grammar, prismLang);
    } catch {
      return input;
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setReview("");

    if (!code.trim()) {
      setError('Please provide code to review.');
      return;
    }

    try {
      setLoading(true);
      const resolvedLanguage = normalizeLanguage(language, customLanguage);
      const resp = await fetch(`${API_BASE}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          filename: filename.trim() || undefined,
          language: resolvedLanguage || undefined,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.details || data?.error || "Request failed");
      }

      setReview(data.review || "No review returned.");
      const newItem = {
        id: `${Date.now()}`,
        filename: filename.trim() || "untitled",
        language: resolvedLanguage || "unknown",
        review: data.review || "",
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => {
        const next = [newItem, ...prev].slice(0, 5);
        window.localStorage.setItem("crs-history", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      handleSubmit(event);
    }
  }

  async function handleCopy() {
    if (!review) return;
    try {
      await navigator.clipboard.writeText(review);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function handleDownload() {
    if (!review) return;
    const payload = reviewData || { review };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(filename || "review").replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleHistorySelect(item) {
    setReview(item.review || "");
    setFilename(item.filename || "untitled");
    setLanguage(item.language || "JavaScript");
    setCustomLanguage("");
    setError("");
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCode(reader.result || "");
      setFilename(file.name || filename);
    };
    reader.readAsText(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCode(reader.result || "");
      setFilename(file.name || filename);
    };
    reader.readAsText(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  const reviewData = useMemo(() => parseReviewJson(review), [review]);
  const sections = useMemo(
    () => (reviewData ? [] : splitReviewIntoSections(review)),
    [review, reviewData],
  );

  return (
    <div className="page">
      <div className="bg-orb orb-one" aria-hidden="true" />
      <div className="bg-orb orb-two" aria-hidden="true" />
      <div className="bg-orb orb-three" aria-hidden="true" />
      <header className="hero">
        <div className="hero-text">
          <p className="eyebrow">Code Review Studio</p>
          <h1>
            Ship safer code with a reviewer that never gets tired.
          </h1>
          <p className="subhead">
            Paste your code, set the context, and get a clear, structured review with
            bugs, security concerns, and fixes you can copy.
          </p>
        </div>
        <div className="hero-card">
          <div className="stat">
            <span>Focus</span>
            <strong>Quality first</strong>
          </div>
          <div className="stat">
            <span>Latency</span>
            <strong>~seconds</strong>
          </div>
          <div className="stat">
            <span>Format</span>
            <strong>Actionable</strong>
          </div>
          <div className="stat">
            <span>Status</span>
            <strong>{loading ? "Reviewing" : "Ready"}</strong>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "Switch to dark" : "Switch to light"}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="panel lift">
          <form className="form" onSubmit={handleSubmit}>
            <div className="row">
              <label>
                Filename
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. reviewController.js"
                  required
                />
              </label>
              <label>
                Language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C#">C#</option>
                  <option value="C++">C++</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="PHP">PHP</option>
                  <option value="Ruby">Ruby</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>
            {language === "Other" && (
              <label>
                Custom Language
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder="e.g. Kotlin"
                  required
                />
              </label>
            )}

            <label className="code-label">
              Code
              <div className="editor-shell" onKeyDown={handleKeyDown}>
                <Editor
                  value={code}
                  onValueChange={setCode}
                  highlight={highlightCode}
                  padding={16}
                  textareaId="code-input"
                  className="code-editor"
                  textareaClassName="code-textarea"
                  preClassName="code-pre"
                  placeholder="Paste code here..."
                />
              </div>
            </label>

            <div className="actions">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setCode(SAMPLE);
                  setReview("");
                  setError("");
                }}
              >
                Load sample
              </button>
              <button type="submit" disabled={!canSubmit}>
                {loading ? "Reviewing..." : "Generate review"}
              </button>
            </div>
            <p className="hint">Tip: Press Ctrl/Cmd + Enter to submit.</p>
          </form>
        </section>

        <section className="panel output lift">
          <div className="output-head">
            <h2>Review Output</h2>
            <div className="output-actions">
              <span className="badge">AI-assisted</span>
              <button
                type="button"
                className="ghost small"
                onClick={handleCopy}
                disabled={!review}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          {!error && !review && !loading && (
            <div className="placeholder">
              Your review will appear here. Keep the code short and focused for best results.
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="shimmer" />
              <p>Analyzing your code...</p>
              <div className="progress">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {review && (
            <div className="review-grid">
              {reviewData ? (
                <>
                  <article className="review reveal">
                    <h3 className="review-title">Summary</h3>
                    <ul className="review-list">
                      {(reviewData.purpose || []).map((item, idx) => (
                        <li key={`purpose-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="review reveal">
                    <h3 className="review-title">Complexity</h3>
                    <div className="review-kv">
                      <span>Time</span>
                      <strong>{reviewData.complexity?.time || "-"}</strong>
                    </div>
                    <div className="review-kv">
                      <span>Space</span>
                      <strong>{reviewData.complexity?.space || "-"}</strong>
                    </div>
                  </article>
                  <article className="review reveal">
                    <h3 className="review-title">Issues</h3>
                    <div className="review-stack">
                      {(reviewData.issues || []).map((item, idx) => (
                        <div className="review-chip" key={`issue-${idx}`}>
                          <p><strong>Issue:</strong> {item.issue || "-"}</p>
                          <p><strong>Fix:</strong> {item.fix || "-"}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                  <article className="review reveal">
                    <h3 className="review-title">Suggestions</h3>
                    <ul className="review-list">
                      {(reviewData.suggestions || []).map((item, idx) => (
                        <li key={`suggestion-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="review reveal">
                    <h3 className="review-title">Severity</h3>
                    <div className="severity-pill">{reviewData.severity || "-"}</div>
                    <div className="review-kv">
                      <span>AI Likelihood</span>
                      <strong>{reviewData.aiLikelihood?.score || "-"}</strong>
                    </div>
                    <p className="review-note">{reviewData.aiLikelihood?.reason || "-"}</p>
                  </article>
                </>
              ) : (
                sections.map((section, index) => (
                  <article className="review prose reveal" key={`${section.title}-${index}`}>
                    {section.title && <h3 className="review-title">{section.title}</h3>}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.body}
                    </ReactMarkdown>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>Backend: {API_BASE}</span>
        <span>Built for focused, fast reviews.</span>
      </footer>
    </div>
  );
}

function normalizeLanguage(language, customLanguage) {
  const base = language === "Other" ? customLanguage : language;
  return (base || "").trim();
}

function toPrismLanguage(lang) {
  const lower = (lang || "").toLowerCase();
  if (lower.includes("typescript")) return "typescript";
  if (lower.includes("python")) return "python";
  if (lower.includes("java") && !lower.includes("javascript")) return "java";
  if (lower.includes("c#") || lower.includes("csharp")) return "csharp";
  if (lower.includes("c++") || lower.includes("cpp")) return "cpp";
  if (lower.includes("go")) return "go";
  if (lower.includes("rust")) return "rust";
  if (lower.includes("php")) return "php";
  if (lower.includes("ruby")) return "ruby";
  if (lower.includes("javascript")) return "javascript";
  return "javascript";
}

function splitReviewIntoSections(text) {
  if (!text?.trim()) return [];
  const lines = text.split("\n");
  const sections = [];
  let current = { title: "", body: "" };

  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)/);
    if (match) {
      if (current.body.trim()) sections.push(current);
      current = { title: match[1].trim(), body: "" };
    } else {
      current.body += `${line}\n`;
    }
  }
  if (current.body.trim()) sections.push(current);
  return sections.length ? sections : [{ title: "", body: text }];
}

function parseReviewJson(text) {
  if (!text?.trim()) return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}
