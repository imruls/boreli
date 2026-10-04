-- La pregunta de seguridad se elimina por completo: la recuperación de
-- contraseña pasa al flujo de email de Supabase (resetPasswordForEmail) y el
-- borrado de cuenta solo pide la contraseña actual. Se quitan las RPCs que
-- la leían y la tabla privada con los hashes.

drop function if exists public.has_security_answer();
drop function if exists public.find_password_recovery_user(text);
drop table if exists public.user_security_answers;
