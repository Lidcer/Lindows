export class OpenFileDialog {
  private _acceptTypes: string;

  public ShowDialog(): Promise<FileList> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (this.acceptTypes) input.accept = this.acceptTypes;

      input.click();

      const fileSelected = () => {
        input.removeEventListener('change', fileSelected);
        resolve(input.files);
      };

      const noFileSelected = () => {
        document.body.removeEventListener('focus', noFileSelected);
        document.body.removeEventListener('mousemove', noFileSelected);
        reject(new Error('canceled'));
      };

      input.addEventListener('change', fileSelected);
      document.body.addEventListener('focus', noFileSelected);
      document.body.addEventListener('mousemove', noFileSelected);
    });
  }

  set acceptTypes(acceptTypes: string) {
    this._acceptTypes = acceptTypes;
  }

  get acceptTypes() {
    return this._acceptTypes;
  }
}
