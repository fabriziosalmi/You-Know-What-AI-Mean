window.addEventListener('load', (event) => {
  MathJax.Hub.Config({
    tex2jax: {
      inlineMath: [['$', '$']],
      displayMath: [['$$', '$$']]
    }
  });
  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
});
