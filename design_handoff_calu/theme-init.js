// Cole INLINE no <head>, antes de qualquer CSS/render.
// Evita o flash de tema errado na primeira pintura.
// Astro: <script is:inline> ... </script> dentro de <head> no Layout.
(function () {
  try {
    var saved = localStorage.getItem('calu-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
