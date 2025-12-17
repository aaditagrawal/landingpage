const links = [
  { name: "blog", href: "https://blog.aadit.cc", icon: "book" },
  { name: "photo", href: "https://photos.aadit.cc", icon: "camera" },
  { name: "design", href: "https://design.aadit.cc", icon: "paintbrush" },
  { name: "cine", href: "https://www.youtube.com/@theaaditagrawal", icon: "film" },
  { name: "git (personal)", href: "https://git.aadit.cc/aadit", icon: "code" },
  { name: "coolstuff", href: "https://coolstuff.work", icon: "heart" },
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
  
  // Create SVG icon based on link type
  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  iconSvg.setAttribute("class", "link-icon");
  iconSvg.setAttribute("viewBox", "0 0 24 24");
  iconSvg.setAttribute("width", "24");
  iconSvg.setAttribute("height", "24");
  iconSvg.setAttribute("fill", "none");
  iconSvg.setAttribute("stroke", "currentColor");
  iconSvg.setAttribute("stroke-width", "2");
  iconSvg.setAttribute("stroke-linecap", "round");
  iconSvg.setAttribute("stroke-linejoin", "round");
  
  let iconPaths = [];
  
  // Set different icons based on link type
  switch(link.icon) {
    case "book":
      iconPaths = [
        "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
        "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
      ];
      break;
    case "camera":
      iconPaths = [
        "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
        "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      ];
      break;
    case "paintbrush":
      iconPaths = [
        "M12 2l7 7-7 7-7-7 7-7z",
        "M12 9l3 3-7 7-3-3 7-7z",
        "M5 19l2 2"
      ];
      break;
    case "film":
      iconPaths = [
        "M4 4h16v16H4z",
        "M4 8h16",
        "M4 12h16",
        "M4 16h16",
        "M8 4v16",
        "M16 4v16"
      ];
      break;
    case "code":
      iconPaths = [
        "M16 18l6-6-6-6",
        "M8 6l-6 6 6 6"
      ];
      break;
    case "heart":
      iconPaths = [
        "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      ];
      break;
  }
  
  iconPaths.forEach(pathData => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    iconSvg.appendChild(path);
  });
  
  linkIndicator.appendChild(iconSvg);

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
    linkIndicator.style.transform = "translateX(4px)";
  });

  linkElement.addEventListener("mouseleave", () => {
    linkIndicator.style.transform = "translateX(0)";
  });

  linksContainer.appendChild(linkElement);
});
