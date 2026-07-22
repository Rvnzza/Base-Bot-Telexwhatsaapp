import fs from "fs";
import path from "path";
import FormData from "form-data";
import { fileTypeFromBuffer } from "file-type";
import fetch from "node-fetch";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function CatBox(buffer) {
  try {
    const type = await fileTypeFromBuffer(buffer);
    const ext = type ? type.ext : "bin";
    
    const form = new FormData();
    form.append("fileToUpload", buffer, `file.${ext}`);
    form.append("reqtype", "fileupload");
    
    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
    });
    return await res.text();
  } catch (e) {
    console.error("CatBox Upload Error:", e);
    return null;
  }
}

export async function uploadImageBuffer(buffer) {
  try {
    return await CatBox(buffer);
  } catch {
    return null;
  }
}

export async function ssstt(tiktokUrl) {
  const url = encodeURIComponent(tiktokUrl);

  const sig = await fetch(`https://ssstt.io/gnstre?url=${url}`).then((r) => r.json());

  if (!sig.signature) throw new Error("Gagal ambil signature");

  const create = await fetch(
    `https://a.ssstt.io/c?url=${url}&signature=${sig.signature}&timestamp=${sig.timestamp}`
  ).then((r) => r.json());

  if (!create.photo_id && !create.video_id)
    throw new Error("Media ID tidak ditemukan");

  let res;

  while (true) {
    res = await fetch(
      `https://a.ssstt.io/p/${create.video_id || create.photo_id}`
    ).then((r) => r.json());

    if (res.message === "completed") break;

    await delay(1500); 
  }

  const meta = res.metadata || {};

  const base = {
    id: meta.id,
    caption: meta.t,
    author: {
      name: meta.nn,
      username: meta.at,
      avatar: meta.avt,
    },
    stats: {
      views: meta.pc,
      likes: meta.dc,
      comments: meta.cc,
      shares: meta.sc,
    },
  };

  if (meta.ctt === "video") {
    return {
      type: "video",
      ...base,
      download: {
        video: res.download_links?.mp4,
        video_hd: res.download_links?.mp4_hd,
        audio: res.download_links?.mp3,
      },
    };
  }
  if (meta.ctt === "photo") {
    return {
      type: "photo",
      ...base,
      images: res.photodl_list || meta.i || [],
      audio: meta.m,
    };
  }

  return base;
}
