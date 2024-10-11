// This server provides a simple RESTful API for storing, retrieving, updating
// and deleting JSON data in a file. 

// Imports
const http = require("http");

// fs - File System Module , used for reading from and writing to files
const fs = require("fs");



//constants
const PORT = 3000;  //the port number the server will listen on
const ITEMS_FILE = "items.json";  //the filename the data will be stored

//GET
const server = http.createServer((req, res) => {  //create a server that takes a callback function that recieves the request and response objects
    if (req.method === "GET" && req.url === "/items") {   //Checks if the request method is GET and if the URL is /items
        try {
            const items = fs.readFileSync(ITEMS_FILE, "utf-8"); //reads the items.json

            res.statusCode = 200; // 200 means status is OK
            res.setHeader("Content-Type", "application/json");
            res.end(items); //changes json to string

            //if reading the file fails it sends a 500 (Internal Server Error) with an error message 
        } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Failed to read data" }));
        }

        //POST information - Checks if the method is POST and if the URL is /items
    } else if (req.method === "POST" && req.url === "/items") {
        let body = "";

        //collects data coming from HTTP requests
        req.on("data", chunk => {
            body = body + chunk.toString() //collect the incoming data chunks and add it to body 
        })

        // End of Data - when all data is recieved, the body is parsed into an object (addedItems)
        //and reads the existing data from items.json
        req.on("end", () => {
            try {
                const addedItems = JSON.parse(body); //pass the JSON-formatted string into a JS object accumulated in the body
                const parsedItems = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf-8"));

                // ID assignment - finds the highest existing ID and assigns a new ID to addedItems for the new entry
                const highestId = parsedItems.length > 0 ? Math.max(...parsedItems.map(item => item.id)) : 0;
                addedItems.id = highestId + 1;

                // Updating Data - Adds the new entry to the array and writes the updated array back to 
                // items.json. 
                parsedItems.push(addedItems);  //adds new data to the end of an existing array
                fs.writeFileSync(ITEMS_FILE, JSON.stringify(parsedItems, null));
                // Responds with a 201 status (Created) and the Updated Data
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify(parsedItems));

            } catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "failed to add data" }));
            }
        })

        // PUT Requests - Checks if the request method is PUT and if the URL is /items 
    } else if (req.method === "PUT" && req.url === "/items") {

        // Similar to POST, collects the incoming data into the body
        let body = "";     
        req.on("data", chunk => {
            body += chunk.toString();  //Accumulate incoming data chunks
        });

        // When all Data is recieved, it parses the body into an object and reads existing data
        req.on("end", () => {
            try {
                const updatedItems = JSON.parse(body);
                const parsedItems = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf-8"));

                // Finding Item - Looks for the Index of the item that matches the ID from updatedItems 
                const updateId = updatedItems.id;
                const index = parsedItems.findIndex((dataItem) => {
                    return dataItem.id === updateId
                })
                //check if id exists and responds with 200 (OK)
                if (index !== -1) {
                    parsedItems[index] = { ...parsedItems[index], ...updatedItems };//copies the existing object and updates the properties
                    fs.writeFileSync(ITEMS_FILE, JSON.stringify(parsedItems, null));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(parsedItems));
                 
                // If the item is not found it responds with a 404 error (Not Found)    
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'ID not found' }));
                }

            } catch (error) {
                console.error('Error updating data:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to update: Invalid data' }));
            }
        });

        // Checks if the request method is DELETE and if the URL starts with /item
    } else if (req.method === "DELETE" && req.url.startsWith("/items")) {

        //Extracts the ID 
        const deleteId = req.url.split("?id=").pop(); 


        //Reads the existing data from items.json 
        try {
            const parsedItems = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf-8")); // reads existing data

            // Finds the index of the item to delete based on the extracted ID
            const index = parsedItems.findIndex((dataItems) => {
                return dataItems.id == deleteId
            })

            //Check if the ID exists before removing it and responding with 200 (OK)
            if (index !== -1) {
                parsedItems.splice(index, 1); //removes the specified data from the array

                fs.writeFileSync(ITEMS_FILE, JSON.stringify(parsedItems, null));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(parsedItems));

            // If not found responds with a 404 error and indicates "Not Found"
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'ID not found' }));
       }

        }catch(error){
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to delete' }));
        }

        //404 Not Found
} else {
        res.statusCode = 404; 
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ message: "Not Found" }))
    }
});


    // The Servers Code - Starts the server and listens on the specified port. Logs a message to
    //the console when the server is running.
server.listen(PORT, () => {
    console.log(`seerver link: http://localhost:${PORT}`);
});
