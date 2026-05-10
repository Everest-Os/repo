export async function launch(ctx, options = {}) {
  const { windowManager } = ctx;

  const content = document.createElement('div');
  content.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-family: var(--font-main);
    color: var(--text-primary);
    background: var(--bg-surface);
  `;
  content.innerHTML = `<h1>Hello from the Online Repository!</h1>`;

  windowManager.createWindow({
    id: 'sample-app',
    title: 'Sample App',
    width: 400,
    height: 200,
    content
  });
}
