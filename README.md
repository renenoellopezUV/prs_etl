# PRS ETL

Instalar:

npm install

agregar archivo.env

DATABASE_URL=
NEXT_PUBLIC_API_URL=

Para llamar a los loaders:

desde url bse de localhost:
localhost/api/etl/traitCategories



Para crear un nuevo etl:
En app/services:
- externalAPI.ts para llamar a la api de pgs catalog.
- transformer.ts para mapear json a schema de prisma.
- etlService.ts para coordinar 

En app/repositories: 
- insertData.ts si es que hay que hace rinserts de relaciones (cero)

En pages/api/etl
- nombreTabla.ts para endpoint de invocacion al loader.


Ejecutar:

curl NEXT_PUBLIC_API_URL/etl/traits
curl NEXT_PUBLIC_API_URL/etl/traitCategories
curl NEXT_PUBLIC_API_URL/etl/publications
curl NEXT_PUBLIC_API_URL/etl/prsModels
curl NEXT_PUBLIC_API_URL/etl/prsModelTraits
curl NEXT_PUBLIC_API_URL/etl/broadAncestryCategories
curl NEXT_PUBLIC_API_URL/etl/developmentSamples
