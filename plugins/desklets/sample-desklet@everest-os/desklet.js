const Desklet = imports.ui.desklet;

function main(metadata, deskletId) {
  return new SampleDesklet(metadata, deskletId);
}

class SampleDesklet extends Desklet.Desklet {
  constructor(metadata, deskletId) {
    super(metadata, deskletId);
    
    this.setHeader("Repo Desklet");
    
    const container = document.createElement('div');
    container.style.padding = '16px';
    container.style.color = '#fff';
    container.style.fontFamily = 'var(--font-main)';
    container.innerHTML = `
      <p style="margin:0; font-size:12px; opacity:0.8;">Hello from the online registry! I live on your desktop.</p>
    `;
    
    // DeskletBase.setContent handles adding to the frame and styling
    this.setContent({ _element: container });
    
    // Set some initial frame styles for the demo
    this._frame.style.width = '200px';
    this._frame.style.background = 'rgba(0,0,0,0.6)';
    this._frame.style.backdropFilter = 'blur(10px)';
    this._frame.style.borderRadius = '12px';
    this._frame.style.border = '1px solid rgba(255,255,255,0.1)';
    this._frame.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
  }
}
