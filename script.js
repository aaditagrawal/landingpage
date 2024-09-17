const links = [
  { name: "photo", href: "https://photos.aadit.cc" },
  { name: "design", href: "#" },
  { name: "cine", href: "https://www.youtube.com/@theaaditagrawal" },
  { name: "git", href: "https://git.aadit.cc" },
];

const linksContainer = document.getElementById("links-container");

// Add CSS for mobile center alignment
const style = document.createElement("style");
style.textContent = `
  @media (max-width: 768px) {
    #links-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }
`;
document.head.appendChild(style);

links.forEach((link) => {
  const linkElement = document.createElement("a");
  linkElement.href = link.href;
  linkElement.className = "link";
  linkElement.target = "_blank";
  linkElement.rel = "noopener noreferrer";
  linkElement.innerHTML = `
        <span class="link-indicator">-</span>
        <span>${link.name}</span>
        <svg class="external-link-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
    `;

  linkElement.addEventListener("mouseenter", () => {
    linkElement.querySelector(".link-indicator").textContent = ">";
  });

  linkElement.addEventListener("mouseleave", () => {
    linkElement.querySelector(".link-indicator").textContent = "-";
  });

  linksContainer.appendChild(linkElement);
});
