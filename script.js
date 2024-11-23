const links = [
  { name: "photo", href: "https://photos.aadit.cc" },
  { name: "design", href: "https://design.aadit.cc" },
  { name: "cine", href: "https://www.youtube.com/@theaaditagrawal" },
  { name: "git", href: "https://github.com/aaditagrawal" },
];

const linksContainer = document.getElementById("links-container");

links.forEach((link) => {
  const linkElement = document.createElement("a");
  linkElement.href = link.href;
  linkElement.className = "link";
  linkElement.target = "_blank";
  linkElement.rel = "noopener noreferrer";

  const linkIndicator = document.createElement("span");
  linkIndicator.className = "link-indicator";
  linkIndicator.textContent = "-";

  const linkText = document.createElement("span");
  linkText.textContent = link.name;

  const svgElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  svgElement.setAttribute("class", "external-link-icon");
  svgElement.setAttribute("viewBox", "0 0 24 24");
  svgElement.setAttribute("width", "24");
  svgElement.setAttribute("height", "24");
  svgElement.setAttribute("stroke", "currentColor");
  svgElement.setAttribute("stroke-width", "2");
  svgElement.setAttribute("fill", "none");
  svgElement.setAttribute("stroke-linecap", "round");
  svgElement.setAttribute("stroke-linejoin", "round");

  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  pathElement.setAttribute(
    "d",
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  );

  const polylineElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline",
  );
  polylineElement.setAttribute("points", "15 3 21 3 21 9");

  const lineElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line",
  );
  lineElement.setAttribute("x1", "10");
  lineElement.setAttribute("y1", "14");
  lineElement.setAttribute("x2", "21");
  lineElement.setAttribute("y2", "3");

  svgElement.appendChild(pathElement);
  svgElement.appendChild(polylineElement);
  svgElement.appendChild(lineElement);

  linkElement.appendChild(linkIndicator);
  linkElement.appendChild(linkText);
  linkElement.appendChild(svgElement);

  linkElement.addEventListener("mouseenter", () => {
    linkIndicator.textContent = ">";
  });

  linkElement.addEventListener("mouseleave", () => {
    linkIndicator.textContent = "-";
  });

  linksContainer.appendChild(linkElement);
});
