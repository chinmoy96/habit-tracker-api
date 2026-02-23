# XP Tracker API

A simple Express.js API with integrated Swagger documentation.

## Features

- **Express.js** - Fast and minimalist web framework
- **Swagger/OpenAPI** - Interactive API documentation
- **RESTful API** - Full CRUD operations for items
- **JSON responses** - Clean JSON API responses
- **Error handling** - Comprehensive error handling
- **Development mode** - Hot reload with nodemon

## Prerequisites

- **Node.js** v14.0.0 or higher
- **npm** (comes with Node.js)

Check your Node.js version:
```bash
node --version
npm --version
```

## Installation

1. Navigate to the project directory:
```bash
cd xpTrackerApi
```

2. Install dependencies:
```bash
npm install
```

This will install:
- `express` - Web framework
- `swagger-jsdoc` - Swagger documentation generator
- `swagger-ui-express` - Swagger UI middleware
- `nodemon` - Development server with auto-reload

## Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

### Custom Port
```bash
PORT=5000 npm start
```

## Accessing the API

### Swagger Documentation
- **URL**: http://localhost:3000/api-docs
- Interactive Swagger UI where you can test all endpoints

### API Base URL
- **URL**: http://localhost:3000

## Available Endpoints

### Get all items
```
GET /api/items
```

### Get single item
```
GET /api/items/:id
```

### Create item
```
POST /api/items
Content-Type: application/json

{
  "name": "Item name",
  "description": "Item description (optional)"
}
```

### Update item
```
PUT /api/items/:id
Content-Type: application/json

{
  "name": "Updated name",
  "description": "Updated description"
}
```

### Delete item
```
DELETE /api/items/:id
```

## Example Requests

Using curl:

```bash
# Get all items
curl http://localhost:3000/api/items

# Get specific item
curl http://localhost:3000/api/items/1

# Create item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"New Item","description":"Test item"}'

# Update item
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Item"}'

# Delete item
curl -X DELETE http://localhost:3000/api/items/1
```

## Project Structure

```
xpTrackerApi/
├── server.js           # Main application file
├── package.json        # Project dependencies
├── .gitignore          # Git ignore rules
└── README.md          # This file
```

## Swagger Definition

The Swagger/OpenAPI documentation is defined using JSDoc comments in the server.js file. Each endpoint is documented with:
- Summary
- Tags for organization
- Parameters
- Request body schema
- Response schema
- Status codes

To add new endpoints:
1. Write the JSDoc comment with `@swagger` tag
2. Add the route handler
3. The Swagger documentation will be automatically updated

## API Documentation

Full OpenAPI 3.0.0 specification at http://localhost:3000/api-docs

## Development

### Auto-reload during development
The `npm run dev` command uses nodemon to automatically restart the server when files change.

### Adding new endpoints
1. Create a JSDoc comment with @swagger tags
2. Add the Express route handler
3. Visit Swagger UI to see the new endpoint

### Testing
Use any HTTP client to test the API:
- Swagger UI (interactive)
- Postman
- curl
- VS Code REST Client extension
- Insomnia

## Troubleshooting

### Port already in use
If port 3000 is already in use, specify a different port:
```bash
PORT=3001 npm start
```

### Dependencies not installing
Try clearing npm cache:
```bash
npm cache clean --force
npm install
```

### Server won't start
- Check that Node.js is installed correctly
- Ensure all dependencies are installed with `npm install`
- Check for syntax errors in server.js

## License

ISC

## Author

Created with Express.js and Swagger
