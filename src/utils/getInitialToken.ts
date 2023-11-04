type FetchDataType = {
  token: string;
};

export const getInitialToken = async (
  taskName: string
): Promise<FetchDataType> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_GET_INITIAL_TOKEN_URL}/${taskName}`,
      {
        method: "POST",
        body: JSON.stringify({ apikey: import.meta.env.TASKS_API_KEY }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        mode: "cors",
      }
    );
    return response.json();
  } catch (error) {
    console.log(error);
    throw new Error("Can't get a intial token");
  }
};
