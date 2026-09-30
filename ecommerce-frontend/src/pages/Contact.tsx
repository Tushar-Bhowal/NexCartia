import Breadcrumb from "@/components/Shared/Breadcrumb";
import FAQ from "@/components/Shared/FAQ";
import { Button } from "@/components/ui/button";
import { useSendMessageMutation } from "@/redux/api/messageApi";
import { CustomError } from "@/types/api-types";
import { ChangeEvent, FormEvent, useState } from "react";
import toast from "react-hot-toast";

const emptyForm = { name: "", email: "", message: "" };

const Contact = () => {
  const [form, setForm] = useState(emptyForm);
  const [sendMessage, { isLoading }] = useSendMessageMutation();

  const changeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await sendMessage(form).unwrap();
      toast.success(res.message);
      setForm(emptyForm);
    } catch (error) {
      toast.error((error as CustomError).data?.message || "Could not send message");
    }
  };

  return (
    <div>
      <div className="mt-12">
        <Breadcrumb pageName="Home" currentPage="Contact Us" />
      </div>
      <div className="flex flex-col max-w-5xl mx-auto w-full md:flex-row justify-between items-center p-6 md:p-12">
        <div className="md:w-1/2 text-center md:text-left flex flex-col md:gap-10 mb-6 md:mb-0">
          <h2 className="text-2xl font-semibold mb-4">
            Need any help? <br /> we're here for you.
          </h2>
          <div className="mb-4">
            <p className="font-medium">CALL US</p>
            <p>+96746737637</p>
            <p>+96746737637</p>
          </div>
          <div>
            <p className="font-medium">MAIL</p>
            <p>hello@NexCartia.com</p>
          </div>
        </div>

        <div className="md:w-1/2 w-full">
          <form className="p-6 rounded-lg space-y-4" onSubmit={submitHandler}>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              value={form.name}
              onChange={changeHandler}
              aria-label="Name"
              placeholder="Name"
              className="w-full p-3 border bg-gray-200 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-150"
            />
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={changeHandler}
              aria-label="Email"
              placeholder="Email"
              className="w-full p-3 border bg-gray-200 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-150"
            />
            <textarea
              name="message"
              required
              maxLength={2000}
              value={form.message}
              onChange={changeHandler}
              aria-label="Message"
              placeholder="Message"
              className="w-full p-3 border bg-gray-200 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-150"
              rows={4}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-3 rounded-md"
            >
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
      <div className="p-6">
        <h1 className="uppercase text-center my-12 text-black-heading font-semibold text-3xl sm:text-5xl">frequently asked</h1>
        <FAQ />
      </div>
    </div>
  );
};

export default Contact;
