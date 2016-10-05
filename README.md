# audionamix.js
[Audionamix](http://audionamix.com/) Audio SDK Node.js

# How to use this client
You have to specifiy your access key and secret environment variables to use this client. See http://audionamix.com/ for more info.

```
$ export AUDIONAMIX_ACCESS_KEY=xxxxxx
$ export AUDIONAMIX_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

Upload a wave file
```
$ node upload.js sample.wav 
Uploading... sample.wav
upload { channel_number: null,
  duration: -1,
  file: 'https://.../sample.wav',
  id: 314329,
  ip: 'xxx.xx.xx.xxx',
  is_valid: true,
  original_file_type: null,
  resource_uri: '/api/v1/audiofile/314329/',
  upload_duration: '0:00:03.047420',
  valid: true }
```

Start the separation process passing the audiofile `id` in the response above.

```
$ node separation.js 314329
separation { extracted_file_id: 314330,
  id: 120571,
  input_file_id: 314329,
  resource_uri: '/api/v1/separation/120571/',
  status: 1 }
 ```

Query the separatation status passing the separation `id` in the response above:

```
$ node status 120571
status { extracted_file_id: 314330,
  id: 120571,
  input_file_id: 314329,
  resource_uri: '/api/v1/separation/120571/',
  status: 50 }
  ```

When the `status` value is 100, download the separated wave output file using the `input_file_id` in the previous status response:

```
$ node download 314330
download ./sample_extracted_314330.wav
```

