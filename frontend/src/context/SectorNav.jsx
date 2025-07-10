import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SectorNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const sectors = ["Dashboard", "Quiz", "Result", "Admin"];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="relative">
      <button className="md:hidden text-2xl p-2 focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
      <ul className={`md:flex md:space-x-4 ${isOpen ? "block" : "hidden"} md:block absolute md:static top-12 left-0 w-full md:w-auto bg-white md:bg-transparent p-4 md:p-0 shadow-md md:shadow-none z-10`}>
        {sectors.map((sector) => (
          <li key={sector} className="mb-2 md:mb-0">
            <button onClick={() => handleNavigate(`/${sector.toLowerCase()}`)} className="block px-4 py-2 text-gray-800 hover:text-blue-600">
              {sector}
            </button>
          </li>
        ))}
      </ul>
      <style>
        {`
          @media (max-width: 768px) {
            .md\\:hidden { display: none; }
            .md\\:flex { display: flex; }
            .md\\:space-x-4 { margin-left: 1rem; }
            .md\\:static { position: static; }
            .md\\:bg-transparent { background: transparent; }
            .md\\:p-0 { padding: 0; }
            .md\\:shadow-none { box-shadow: none; }
          }
        `}
      </style>
    </nav>
  );
}