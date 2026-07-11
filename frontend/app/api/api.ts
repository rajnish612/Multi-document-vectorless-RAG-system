import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API,
  timeout: 30000,
});

export const uploadDoc = async (doc: File, token: string) => {
  try {
    const formData = new FormData();
    formData.append("pdf", doc);
    const res = await axiosInstance.post("/api/doc/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = res.data;
    return data;
  } catch (err) {
    throw err;
  }
};
export const getAllDocs = async (token: string) => {
  try {
    const res = await axiosInstance.get("/api/docs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = res.data;
    return data;
  } catch (err) {
    throw err;
  }
};
export const chat = async (token: string, doc_id: string, query: string) => {
  try {
    const res = await axiosInstance.post(
      `/api/chat/${doc_id}?query=${query}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = res.data;
    return data;
  } catch (err) {
    throw err;
  }
};

export const getAllMessages = async (token: string, doc_id: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/chat/messages?doc_id=${doc_id}`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};
export const deleteDoc = async (token: string, doc_id: string) => {
  try {
    const res = await axiosInstance.delete(`/api/docs/${doc_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};
