// Datos de departamentos y ciudades principales de Colombia
export const departamentosYCiudades = {
    "Amazonas": ["Leticia", "Puerto Nariño"],
    "Antioquia": ["Medellín", "Bello", "Envigado", "Itagüí", "Rionegro", "Apartadó", "Turbo"],
    "Arauca": ["Arauca", "Saravena", "Tame"],
    "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Sabanalarga"],
    "Bolívar": ["Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar", "Arjona"],
    "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Puerto Boyacá"],
    "Caldas": ["Manizales", "La Dorada", "Villamaría", "Chinchiná", "Riosucio"],
    "Caquetá": ["Florencia", "San Vicente del Caguán", "Puerto Rico"],
    "Casanare": ["Yopal", "Aguazul", "Villanueva", "Monterrey"],
    "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Piendamó"],
    "Cesar": ["Valledupar", "Aguachica", "Codazzi", "Bosconia", "Curumaní"],
    "Chocó": ["Quibdó", "Istmina", "Tadó", "Condoto"],
    "Córdoba": ["Montería", "Cereté", "Lorica", "Sahagún", "Planeta Rica"],
    "Cundinamarca": ["Bogotá", "Soacha", "Facatativá", "Zipaquirá", "Girardot", "Fusagasugá", "Chía", "Mosquera", "Madrid", "Cajicá"],
    "Guainía": ["Inírida"],
    "Guaviare": ["San José del Guaviare", "El Retorno", "Calamar"],
    "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata"],
    "La Guajira": ["Riohacha", "Maicao", "Uribia", "San Juan del Cesar", "Fonseca"],
    "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "El Banco", "Plato"],
    "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López", "San Martín"],
    "Nariño": ["Pasto", "Tumaco", "Ipiales", "Túquerres", "La Unión"],
    "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Los Patios", "Villa del Rosario"],
    "Putumayo": ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez"],
    "Quindío": ["Armenia", "Calarcá", "Montenegro", "Quimbaya", "La Tebaida"],
    "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
    "San Andrés y Providencia": ["San Andrés", "Providencia"],
    "Santander": ["Bucaramanga", "Floridablanca", "Barrancabermeja", "Girón", "Piedecuesta", "San Gil"],
    "Sucre": ["Sincelejo", "Corozal", "Tolú", "San Marcos"],
    "Tolima": ["Ibagué", "Espinal", "Melgar", "Honda", "Mariquita"],
    "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga", "Jamundí", "Yumbo"],
    "Vaupés": ["Mitú"],
    "Vichada": ["Puerto Carreño"]
  };
  
  // Lista plana de departamentos (para los <option>)
  export const departamentos = Object.keys(departamentosYCiudades);