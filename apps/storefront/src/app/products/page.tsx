useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const initialCategory = params.get("category") || "";
  const initialBrand = params.get("brand") || "";
  const initialSearch = params.get("search") || "";

  if (initialCategory) setCategory(initialCategory);
  if (initialBrand) setBrand(initialBrand);
  if (initialSearch) setSearch(initialSearch);

  setPage(1);
}, []);
