
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    (python3.withPackages (ps: with ps; [
      fastapi
      uvicorn
      python-dotenv
      python-multipart
      motor
      pymongo
      certifi
      pydantic
      python-socketio
      python-engineio
      firebase-admin-sdk
      python-jose
      pyjwt
      passlib
      bcrypt
      cryptography
      email-validator
      httpx
      aiohttp
      requests
      aiofiles
      python-dateutil
      typing-extensions
      starlette
    ]))
  ];
}
