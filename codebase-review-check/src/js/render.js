export function renderContent(content) {
  const titleEl = document.getElementById("site-title");
  const heroLeadEl = document.getElementById("hero-lead");
  const sectionsRoot = document.getElementById("sections-root");

  if (!titleEl || !heroLeadEl || !sectionsRoot) return;

  document.title = content.title;
  titleEl.textContent = content.title;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && content.description) {
    metaDesc.setAttribute("content", content.description);
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogTitle) ogTitle.setAttribute("content", content.title);
  if (ogDesc && content.description) {
    ogDesc.setAttribute("content", content.description);
  }

  const firstSection = content.sections[0];
  if (!firstSection) {
    heroLeadEl.textContent = content.description || "";
    return;
  }

  const firstParagraph = firstSection.blocks.find((b) => b.type === "paragraph");
  heroLeadEl.textContent = firstParagraph?.text ?? content.description ?? "";

  const sectionsToRender = content.sections.slice(1);
  if (
    content.sections.length === 1 &&
    firstSection.blocks.length > 1
  ) {
    sectionsToRender.unshift({
      ...firstSection,
      blocks: firstSection.blocks.slice(1),
    });
  } else if (content.sections.length === 1) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const section of sectionsToRender.length
    ? sectionsToRender
    : content.sections) {
    fragment.appendChild(createSection(section));
  }

  sectionsRoot.replaceChildren(fragment);
}

function createSection(section) {
  const article = document.createElement("section");
  article.className = "chapter";
  article.id = section.id;
  article.setAttribute("data-theme", section.theme);

  const container = document.createElement("div");
  container.className = "container";

  if (section.headline) {
    const headline = document.createElement("h2");
    headline.className = "chapter__headline reveal";
    headline.textContent = section.headline;
    container.appendChild(headline);
  }

  const body = document.createElement("div");
  body.className = "chapter__body";

  let revealIndex = 0;

  for (const block of section.blocks) {
    if (block.type === "paragraph") {
      const p = document.createElement("p");
      p.className = `chapter__paragraph reveal${delayClass(revealIndex)}`;
      p.textContent = block.text;
      body.appendChild(p);
      revealIndex++;
    } else if (block.type === "questions") {
      const ul = document.createElement("ul");
      ul.className = "chapter__questions";
      for (const item of block.items) {
        const li = document.createElement("li");
        li.className = `chapter__question reveal${delayClass(revealIndex)}`;
        li.textContent = item;
        ul.appendChild(li);
        revealIndex++;
      }
      body.appendChild(ul);
    }
  }

  container.appendChild(body);
  article.appendChild(container);
  return article;
}

function delayClass(index) {
  const slot = (index % 4) + 1;
  return slot > 0 ? ` reveal--delay-${slot}` : "";
}

export function initRevealObserver() {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("is-visible");
    });
    return null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  return observer;
}

export function observeNewReveals(observer) {
  if (!observer) return;
  document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
    observer.observe(el);
  });
}
