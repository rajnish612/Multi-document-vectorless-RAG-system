import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
});

export const uploadDoc = async (doc, token) => {
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
export const getAllDocs = async (token) => {
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
export const chat = async (token, doc_id, query) => {
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

export const getAllMessages = async (token, doc_id) => {
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
