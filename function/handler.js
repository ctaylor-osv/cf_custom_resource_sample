const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const sendResponse = (event, context, responseStatus, responseData) => {
	const {Param1, Param2} = event.ResourceProperties;
	return new Promise((res, rej) => {
		var responseBody = JSON.stringify({
			Status: responseStatus,
			// to test same/different PhysicalResourceIds
			// PhysicalResourceId: `${Param1}`,
			PhysicalResourceId: `${event.StackId}-${event.LogicalResourceId}`,
			// these are required parameters
			StackId: event.StackId,
			RequestId: event.RequestId,
			LogicalResourceId: event.LogicalResourceId,
			Data: responseData
		});
	
		console.log("RESPONSE BODY:\n", responseBody);
	
		const https = require("https");
		const url = require("url");
	
		const parsedUrl = url.parse(event.ResponseURL);
		const options = {
			hostname: parsedUrl.hostname,
			port: 443,
			path: parsedUrl.path,
			method: "PUT",
			headers: {
				"content-type": "",
				"content-length": responseBody.length
			}
		};
	
		console.log("SENDING RESPONSE...\n");
	
		const request = https.request(options, function(response) {
			console.log("STATUS: " + response.statusCode);
			console.log("HEADERS: " + JSON.stringify(response.headers));

			context.done();

			res();
		});
	
		request.on("error", function(error) {
			console.log("sendResponse Error:" + error);

			context.done();

			rej();
		});
	
		request.write(responseBody);
		request.end();
	});
}

exports.index = async (event, context) => {
	const {Param1, Param2} = event.ResourceProperties;

	console.log(`Got Param1=${Param1} and Param2=${Param2}`);

	try {
		console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));

		if (event.RequestType == "Delete") {
			console.log("Handling delete");
			await sendResponse(event, context, "SUCCESS", {});
			return;
		}

		if (event.RequestType === "Update") {
			console.log("Handling update");
			const {Param1: oldParam1, Param2: oldParam2} = event.OldResourceProperties;

			console.log(`The old resource's Param1=${oldParam1} and Param2=${oldParam2}`);
		}

		await sendResponse(event, context, "SUCCESS", {Out: `With Param1=${Param1} and Param2=${Param2}`});
	}catch(e) {
		await sendResponse(event, context, "FAILURE", {});
	}
};