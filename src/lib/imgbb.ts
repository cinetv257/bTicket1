const IMGBB_API_KEY = "3f547b78ae6f3d23068203a85132911f";

/** Uploads an image file to ImgBB and returns the hosted URL. */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body,
  });
  const json = (await res.json()) as { success: boolean; data?: { url: string }; error?: { message: string } };
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "Échec du téléversement de l'image");
  }
  return json.data.url;
}
