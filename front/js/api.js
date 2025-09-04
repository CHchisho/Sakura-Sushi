export const getMenu = async () => {
  const response = await fetch('/api/menu');
  return response.json();
};
