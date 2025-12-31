import { logs, parse } from "./json_parser";

const result = parse(await Bun.file("./b.result.json").text(), (res) => {
	console.table(logs);
});

console.log(JSON.stringify(result, null, 2));
