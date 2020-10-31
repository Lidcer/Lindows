import Axios from "axios";

const imagesMap = new Map<string, string>();

export function disassembleError(error: any) {
  if (error && error.response && error.response.data && error.response.data.error) {
    return new Error(error.response.data.error);
  } else {
    return new Error("Problem server");
  }
}

export function fetchImage(imageUrl: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const couldBeImage = imagesMap.get(imageUrl);
    if (couldBeImage) return resolve(couldBeImage);

    const image = imagesMap.get(imageUrl);
    if (image) return resolve(image);

    Axios.get(imageUrl, {
      responseType: "arraybuffer",
    })
      .then(response => {
        const imageBase64 = Buffer.from(response.data, "binary").toString("base64");
        imagesMap.set(imageUrl, imageBase64);
        resolve(imageBase64);
      })
      .catch(err => {
        reject(err);
      });
  });
}

export function attachToWindowIfDev(value: string, method: any) {
  if (DEV) {
    attachToWindow(value, method);
  }
}
export function attachToWindow(value: string, method: any) {
  (window as any)[value] = method;
}

export function isDev() {
  return (window as any).DEV;
}
