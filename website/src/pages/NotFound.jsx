import { Link } from "react-router-dom";
import Page from "../components/Page.jsx";
import Button from "../components/Button.jsx";

export default function NotFound() {
  return (
    <Page>
      <div className="glass mx-auto max-w-xl rounded-lg p-8 text-center">
        <h1 className="text-4xl font-black">Route not found</h1>
        <p className="mt-3 text-white/62">This page is not in the Aron collection index.</p>
        <Link to="/"><Button className="mt-6">Return Home</Button></Link>
      </div>
    </Page>
  );
}
