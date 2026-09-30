import toast from "react-hot-toast";
import { useState, useEffect, FormEvent } from "react";
import AdminSidebar from "../../../components/Shared/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  useDeleteProductMutation,
  useProductDetailsQuery,
  useUpdateProductMutation,
} from "@/redux/api/productApi";
import { responseToast } from "@/utils/Features";
import { useFileHandler } from "6pp";

const ProductManagement = () => {
  const params = useParams();
  const navigate = useNavigate();

  const { data, isError } = useProductDetailsQuery(params.id!);

  const { price, photos, name, stock, category, gender } = data?.product || {
    photos: [],
    category: "",
    name: "",
    stock: 0,
    price: 0,
    gender: "",
  };
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [priceUpdate, setPriceUpdate] = useState<number>(price);
  const [stockUpdate, setStockUpdate] = useState<number>(stock);
  const [nameUpdate, setNameUpdate] = useState<string>(name);
  const [categoryUpdate, setCategoryUpdate] = useState<string>(category);
  const [genderUpdate, setGenderUpdate] = useState<string>(gender);
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const photosFiles = useFileHandler("multiple", 10, 5);
  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBtnLoading(true);
    try {
      const formData = new FormData();

      if (nameUpdate) formData.set("name", nameUpdate);
      if (priceUpdate) formData.set("price", priceUpdate.toString());
      if (stockUpdate !== undefined)
        formData.set("stock", stockUpdate.toString());

      if (categoryUpdate) formData.set("category", categoryUpdate);
      if (genderUpdate) formData.set("gender", genderUpdate);
      if (photosFiles.file && photosFiles.file.length > 0) {
        photosFiles.file.forEach((file) => {
          formData.append("photos", file);
        });
      }

      const res = await updateProduct({
        formData,
        productId: data!.product._id,
      });

      responseToast(res, navigate, "/admin/product");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBtnLoading(false);
    }
  };

  const deleteHandler = async () => {
    if (!data) return;

    const res = await deleteProduct(data.product._id);

    responseToast(res, navigate, "/admin/product");
  };

  useEffect(() => {
    if (data) {
      setNameUpdate(data.product.name);
      setPriceUpdate(data.product.price);
      setStockUpdate(data.product.stock);
      setCategoryUpdate(data.product.category);
      setGenderUpdate(data.product.gender);
    }
  }, [data]);
  if (isError) return <Navigate to={"/404"} />;
  return (
    <div className="admin-container h-screen bg-gray-50/50 overflow-y-auto">
      <div>
        {" "}
        <AdminSidebar />{" "}
      </div>
      <main className="product-management flex flex-col sm:flex-row gap-4 justify-center items-center p-4 overflow-y-auto">
        <section
          style={{ height: "85vh" }}
          className="w-full max-w-lg p-10 flex flex-col relative rounded-xl bg-white text-gray-700 shadow-md  overflow-y-auto"
        >
          <strong className="mb-5 text-slate-400">
            ID - {data?.product._id}
          </strong>
          <img className="" src={`${photos?.[0]?.url}`} alt="Product" />
          <p className="text-xl text-center uppercase mt-10 mb-3">{name}</p>
          {stock > 0 ? (
            <span className="absolute top-3 right-4 text-green-500">
              {stock} Available
            </span>
          ) : (
            <span className="text-red-600 absolute top-3 right-4">
              Not Available
            </span>
          )}
          <h3 className="text-3xl font-bold text-center">₹{price}</h3>
        </section>
        <article
          style={{ height: "85vh" }}
          className="w-full max-w-md p-8 flex flex-col relative rounded-xl bg-white text-gray-700 shadow-md"
        >
          <Button
            className="bg-black-text hover:bg-black-text/90 w-1/6"
            onClick={deleteHandler}
          >
            <Trash className="w-6 h-6 text-white " />
          </Button>
          <form onSubmit={submitHandler}>
            <h2 className="antialiased tracking-normal text-2xl font-semibold leading-snug text-center mb-5">
              MANAGE
            </h2>
            <div>
              <label className="block mt-2 mb-2 text-sm font-medium text-gray-900">
                Name
              </label>
              <input
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                type="text"
                placeholder="Name"
                value={nameUpdate}
                onChange={(e) => setNameUpdate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mt-2 mb-2 text-sm font-medium text-gray-900">
                Price
              </label>
              <input
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                type="number"
                placeholder="Price"
                value={priceUpdate}
                onChange={(e) => setPriceUpdate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block mt-2 mb-2 text-sm font-medium text-gray-900">
                Stock
              </label>
              <input
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                type="number"
                placeholder="Stock"
                value={stockUpdate}
                onChange={(e) => setStockUpdate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block mt-2 mb-2 text-sm font-medium text-gray-900">
                Category
              </label>
              <input
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                type="text"
                placeholder="eg. jeans, t-shirt etc"
                value={categoryUpdate}
                onChange={(e) => setCategoryUpdate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mt-2 mb-2 text-sm font-medium text-gray-900">
                Gender
              </label>
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={genderUpdate}
                onChange={(e) => setGenderUpdate(e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block mt-2 mb-2 text-sm font-medium text-gray-900">
                Photos
              </label>
              <input
                className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                type="file"
                accept="image/*"
                multiple
                onChange={photosFiles.changeHandler}
              />
            </div>

            {photosFiles.error && <p>{photosFiles.error}</p>}

            {photosFiles.preview && (
              <div style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
                {photosFiles.preview.map((img, i) => (
                  <img
                    style={{ width: 100, height: 100, objectFit: "cover" }}
                    key={i}
                    src={img}
                    alt="New Image"
                  />
                ))}
              </div>
            )}
            <div>
              <Button
                disabled={btnLoading}
                variant="destructive"
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update
              </Button>
            </div>
          </form>
        </article>
      </main>
    </div>
  );
};

export default ProductManagement;
