const Applet = imports.ui.applet;

function main(metadata, orientation, panel_height, instance_id) {
  return new SampleApplet(metadata, orientation, panel_height, instance_id);
}

class SampleApplet extends Applet.Applet {
  constructor(metadata, orientation, panel_height, instance_id) {
    super(metadata, orientation, panel_height, instance_id);
    
    this._element.style.display = 'flex';
    this._element.style.alignItems = 'center';
    this._element.style.padding = '0 8px';
    this._element.style.cursor = 'pointer';
    this._element.innerHTML = '🚀';

    this.set_applet_tooltip("Sample Applet from Repo");
  }

  on_applet_clicked(event) {
    imports.dialog.showSystemDialog({
      title: 'Applet',
      message: 'You clicked the sample applet from the repo!',
      type: 'alert'
    });
  }
}
