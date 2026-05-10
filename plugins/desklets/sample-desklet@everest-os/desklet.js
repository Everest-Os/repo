function init(imports) {
  return new SampleDesklet(imports);
}

class SampleDesklet {
  constructor(imports) {
    this.uuid = "sample-desklet@everest-os";
    this.iconHelper = imports.iconHelper;

    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.top = '100px';
    this.el.style.right = '50px';
    this.el.style.width = '200px';
    this.el.style.padding = '16px';
    this.el.style.background = 'rgba(0,0,0,0.6)';
    this.el.style.color = '#fff';
    this.el.style.borderRadius = '12px';
    this.el.style.backdropFilter = 'blur(10px)';
    this.el.style.border = '1px solid rgba(255,255,255,0.1)';
    this.el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
    this.el.style.fontFamily = 'var(--font-main)';

    this.el.innerHTML = `
      <h3 style="margin:0 0 8px 0; font-size:14px; color:var(--accent);">Repo Desklet</h3>
      <p style="margin:0; font-size:12px; opacity:0.8;">Hello from the online registry! I live on your desktop.</p>
    `;
  }

  onEnable() {
    console.log("Sample Desklet enabled!");
    const desktop = document.getElementById('desktop');
    if (desktop) {
      desktop.appendChild(this.el);
    }
  }

  onDisable() {
    console.log("Sample Desklet disabled!");
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}
