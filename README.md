## Backup a vercel blob
This repository is entirely dedicated to share two scripts to create a backup from Vercel Blob and eventually restore it.
The script is entirely done in node.js, so is possible to run the script on a local machine that with a connection to the internet is the retrieving the information directly from Vercel.
To create a connection with Vercel a token to use the API is needed, for that reason to use the repository correctly you should create a `.env` file in the same folder of the sripts inserting the following information:
```
BLOB_READ_WRITE_TOKEN="your_vercel_blob_api_key"
```

Please note that the script is entirely developed for the [Echoes of Exclusion](https://github.com/zumatt/maind-echoes-of-exclusion), so you should adapt the code to your needs.