import tiktoken

encoder = tiktoken.get_encoding("cl100k_base")

text = "蘋果、香蕉、西瓜、鳳梨、葡萄"
tokens = encoder.encode(text)

token_count = len(tokens)

print(f"Token 数量: {token_count}")