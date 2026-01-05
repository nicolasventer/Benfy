import { logs, parse } from "./json_parser";

const result = parse(
	`{
	"name": "John",
	"age": 30,
	"city": "New York"
}`,
	"",
	(res) => {
		console.table(logs);
		console.log("parse failed");
	}
);

// console.log(JSON.stringify(result, null, 2));
console.log("parse success");
