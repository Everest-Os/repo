function main(metadata, orientation, panel_height, instance_id) {
  return new SampleApplet(metadata, orientation, panel_height, instance_id);
}

class SampleApplet {
  constructor(metadata, orientation, panel_height, instance_id) {
    this.uuid = "sample-applet@everest-os";
    
    this.el = document.createElement('div');
    this.el.className = 'panel-button';
    this.el.style.display = 'flex';
    this.el.style.alignItems = 'center';
    this.el.style.padding = '0 8px';
    this.el.style.cursor = 'pointer';
    this.el.innerHTML = '🚀';

    this.el.onclick = () => {
      imports.dialog.showSystemDialog({
        title: 'Applet',
        message: 'You clicked the sample applet from the repo!',
        type: 'alert'
      });
    };
  }

  onEnable() {
    console.log("Sample Applet enabled!");
    const panel = document.querySelector('#panel-right');
    if (panel) {
      panel.insertBefore(this.el, panel.firstChild);
    }
  }

  onDisable() {
    console.log("Sample Applet disabled!");
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}
