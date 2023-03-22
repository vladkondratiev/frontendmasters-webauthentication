import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import * as url from 'url';
import bcrypt from 'bcryptjs';
import * as jwtJsDecode from 'jwt-js-decode';
import base64url from "base64url";
import SimpleWebAuthnServer from '@simplewebauthn/server';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express()
app.use(express.json())

const adapter = new JSONFile(__dirname + '/auth.json');
const db = new Low(adapter);
await db.read();
db.data ||= { users: [] }

const rpID = "localhost";
const protocol = "http";
const port = 5050;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

function findUser(email) {
  const results = db.data.users.filter(u => u.email === email);
  if (results.length === 0) return;
  return results[0];
};

// ADD HERE THE REST OF THE ENDPOINTS
app.post("/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  
  // hashing password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // TODO: data validation 
  const user = {
    name,
    email,
    password: hashedPassword,
  };

  const userFound = findUser(email);
  if (userFound) {
    // user already exists
    res.send({ ok: false, message: 'User already exists' });
  } else {
    // user is unique
    db.data.users.push(user);
    db.write();
    res.send({ ok: true });
  };
});


app.get("*", (req, res) => {
    res.sendFile(__dirname + "public/index.html"); 
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

