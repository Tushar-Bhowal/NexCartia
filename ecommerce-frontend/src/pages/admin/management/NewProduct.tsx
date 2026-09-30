import toast from "react-hot-toast";
import { useState, FormEvent } from "react";
import AdminSidebar from "../../../components/Shared/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { useNewProductMutation } from "@/redux/api/productApi";
import { useNavigate } from "react-router-dom";
import { responseToast } from "@/utils/Features";
import { useFileHandler } from "6pp";
import CatalogFields from "@/components/Shared/admin/CatalogFields";
import { appendCatalog, emptyCatalog } from "@/lib/catalog";

const NewProduct = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<number>(1000);
  const [stock, setStock] = useState<number>(1);
  const [gender, setGender] = useState<string>("");
  const [catalog, setCatalog] = useState(emptyCatalog);

  const [newProduct] = useNewProductMutation();

  const navigate = useNavigate();

  const photos = useFileHandler("multiple", 10, 5);


  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!name || !price || stock < 0 || !category || !gender) return;

      if (!photos.file || photos.file.length === 0) return;

      const formData = new FormData();

      formData.set("name", name);
      formData.set("price", price.toString());
      formData.set("stock", stock.toString());
      formData.set("category", category);
      formData.set("gender", gender);
      appendCatalog(formData, catalog);

      photos.file.forEach((file) => {
        formData.append("photos", file);
      });

      const res = await newProduct(formData);

      responseToast(res, navigate, "/admin/product");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="lg:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>

      <main className="flex-grow overflow-y-auto bg-gray-50/50 p-4 md:p-8 lg:p-12">
        <div className="max-w-md lg:max-w-lg mx-auto">
          <article className="bg-white rounded-xl shadow-md p-6 md:p-8">
            <form onSubmit={submitHandler} className="space-y-4">
              <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
                New Product
              </h2>

              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Name
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Price Input */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Price
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>

                {/* Stock Input */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Stock
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    type="number"
                    placeholder="Stock"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                  />
                </div>

                {/* Category Input */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Category
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    type="text"
                    placeholder="eg. jeans, t-shirt etc"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                {/* Gender Select */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <CatalogFields values={catalog} onChange={setCatalog} />

                {/* Photo Upload */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Photos
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    multiple
                     accept="image/*"
                    type="file"
                    onChange={photos.changeHandler}
                  />
                </div>
                {photos.error && <p>{photos.error}</p>}
                {/* Photo Preview */}

                <div className="mt-4 flex justify-center">
                  {photos.preview &&
                    photos.preview.map((img, i) => (
                      <img
                        key={i}
                        className="max-w-full h-auto rounded-xl max-h-64 object-cover"
                        src={img}
                        alt="New Product"
                      />
                    ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button variant="destructive" disabled={isLoading} className="w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                Create Product
              </Button>
            </form>
          </article>
        </div>
      </main>
    </div>
  );
};

export default NewProduct;
