# audionamix.js
[Audionamix](http://audionamix.com/) Audio SDK Node.js

# How to use this client
You have to specifiy your access key and secret environment variables to use this client. See http://audionamix.com/ for more info.

```
$ export AUDIONAMIX_ACCESS_KEY=xxxxxx
$ export AUDIONAMIX_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

# A simple Workflow

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


# Enhanced Workflow

Upload the audio wave file

```
$ node upload sample2.wav 
Uploading... sample2.wav
upload { channel_number: null,
  duration: -1,
  file: 'https://xxxx/sample2_fanTKcD.wav',
  id: 316517,
  ip: 'xx.xx.xx.xxx',
  is_valid: true,
  original_file_type: null,
  resource_uri: '/api/v1/audiofile/316517/',
  upload_duration: '0:00:02.741144',
  valid: true }
```

Launch a preanalysis with `pitch` algorithm for voice pitch detection

```
$ node preanalysis.js 316517 pitch
Algorithm will be pitch
preanalysis { id: 29446,
  is_finished: false,
  resource_uri: '/api/v1/preanalysis/29446/',
  status: 0 }
```

Launch a preanalysis with `csnt` algorithm for voice consonants detection

```
$ node preanalysis.js 316517 csnt
Algorithm will be csnt

preanalysis { id: 29447,
  is_finished: false,
  resource_uri: '/api/v1/preanalysis/29447/',
  status: 0 }
```

Check the preanalysis status for these analysis

```
$ node status_preanalysis.js 29446 5
check status every 5 secs.

Fri Oct 07 2016 16:25:01 GMT+0200 (CEST) 
To stop press Ctrl-C
status
 { id: 29446,
  is_finished: true,
  resource_uri: '/api/v1/preanalysis/29446/',
  status: 100 }
```

and

```
$ node status_preanalysis.js 29447 5
check status every 5 secs.

Fri Oct 07 2016 16:25:27 GMT+0200 (CEST) 
To stop press Ctrl-C
status
 { id: 29447,
  is_finished: true,
  resource_uri: '/api/v1/preanalysis/29447/',
  status: 100 }
```

Retrieve preanalysis annotations

```
$ node annotation 29446
annotation ./annotation_29446.json
$ node annotation 29447
annotation ./annotation_29447.json
```

Merge the two json files in order to keep the keys (not overlapping) in it like

```javascript
var FileUtil=require('../lib/fileutil');
var annotation1 = FileUtil.readFileSync(annotationFile1,true);
var annotation2 = FileUtil.readFileSync(annotationFile2,true);
for(var key in annotation2) {
    if( typeof(annotation1[key])!='undefined' ) annotation1[key] = annotation2[key];
}
FileUtil.writeToFileSync(configurationFile, JSON.stringify(annotation1));
```

Upload the merged annotations file

```
$ node configuration.js annotation_merged.json 
Uploading... annotation_merged.json
configuration { big_dipper: true,
  breathiness: false,
  consonants_activity: '[]',
  extra_parameters_patch: '',
  high_quality: false,
  id: 334785,
  maximum_frequency: -1,
  minimum_frequency: -1,
  panning_vector: null,
  preference_name: null,
  processed_segments: null,
  rectangle_annotation: '',
  resource_uri: '/api/v1/configuration/334785/',
  reverb_time: 0,
  voice_activity: null }
```

Start the separation process for the file `id` obtained above and the configuration `id` of the previous json response

```
$ node separation.js 316517 334785
Configuration will be 334785
separation { configuration_id: 334785,
  extracted_file_id: 316525,
  id: 121318,
  input_file_id: 316517,
  resource_uri: '/api/v1/separation/121318/',
  status: 1 }
```

Check the separation status for this separation id

```
$ node status_separation.js 121318
check status every 5 secs.

Fri Oct 07 2016 16:38:12 GMT+0200 (CEST) 
To stop press Ctrl-C
status
 { configuration_id: 334785,
  extracted_file_id: 316525,
  id: 121318,
  input_file_id: 316517,
  resource_uri: '/api/v1/separation/121318/',
  status: 100 }
```

When the `status` is 100, download the separated wave file for the extrated file `id` specified in the response above

```
$ node download.js 316525
download ./sample_extracted_316525.wav
```

