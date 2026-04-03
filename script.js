document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.cat-btn');
  const panels = document.querySelectorAll('.panel');
  const themeToggle = document.querySelector('.theme-toggle');
  const html = document.documentElement;

  // Category switching
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.section;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panels.forEach(panel => {
        panel.classList.remove('active');
        panel.style.animation = 'none';
      });

      const activePanel = document.getElementById(target);
      if (activePanel) {
        // Force reflow to restart animation
        void activePanel.offsetHeight;
        activePanel.style.animation = '';
        activePanel.classList.add('active');
      }
    });
  });

  // Theme toggle
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
  }

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
});
