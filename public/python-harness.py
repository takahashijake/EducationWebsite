"""Trusted teaching harness; a fresh Worker/interpreter is used for each request.

This is not a security boundary. Learner code and checks share a client runtime.
"""
import builtins
import io
import json
import linecache
import sys
import traceback


def execute_payload(payload):
    source = payload['source']
    checks = payload.get('tests', [])
    streams = (sys.stdout, sys.stderr, sys.stdin)
    original_dict = builtins.__dict__
    original_builtins = dict(original_dict)
    compile_code, execute_code = compile, exec
    format_error = traceback.format_exc
    results = []
    failure = None
    kind = 'success'
    linecache.cache['learner.py'] = (len(source), None, source.splitlines(True), 'learner.py')
    try:
        compiled = compile_code(source, 'learner.py', 'exec')
    except SyntaxError:
        return json.dumps({'kind': 'syntax-error', 'error': format_error(), 'tests': []})

    def prepare():
        # Restore ordinary stream/builtin changes between authored check groups.
        # This does not isolate modules or make client grading tamper-resistant.
        original_dict.clear()
        original_dict.update(original_builtins)
        sys.stdout, sys.stderr = streams[:2]
        sys.stdin = io.StringIO(payload.get('stdin', ''))
        return {'__name__': '__learner__' if checks else '__main__', '__builtins__': builtins}

    if not checks:
        try:
            execute_code(compiled, prepare())
        except BaseException as error:
            kind = 'syntax-error' if isinstance(error, SyntaxError) else 'runtime-error'
            failure = format_error()
    else:
        for check in checks:
            namespace = prepare()
            filename = 'checks/' + check['id'] + '.py'
            text = check['code']
            linecache.cache[filename] = (len(text), None, text.splitlines(True), filename)
            phase = 'implementation'
            try:
                execute_code(compiled, namespace)
                phase = 'check'
                execute_code(compile_code(text, filename, 'exec'), namespace)
                results.append({'id': check['id'], 'status': 'passed'})
            except BaseException as error:
                detail = format_error()
                results.append({'id': check['id'], 'status': 'failed', 'error': detail})
                if phase == 'implementation':
                    kind = 'syntax-error' if isinstance(error, SyntaxError) else 'runtime-error'
                    failure = detail
                elif kind == 'success':
                    kind = 'test-failure'
    sys.stdout, sys.stderr, sys.stdin = streams
    original_dict.clear()
    original_dict.update(original_builtins)
    streams[0].flush()
    streams[1].flush()
    return json.dumps({'kind': kind, 'error': failure, 'tests': results})
